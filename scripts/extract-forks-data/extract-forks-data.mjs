import { FluentBundle, FluentResource } from "@fluent/bundle";
import fs from "fs";
import yaml from "js-yaml";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

(function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const forksDir = join(__dirname, "../clone-forks/");
  for (const entry of fs.readdirSync(forksDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const fork = entry.name;
      const data = loadForkData(join(forksDir, fork));
      fs.writeFileSync(
        join(__dirname, "../../src/assets", `${fork}-data.json`),
        JSON.stringify(data, null, 2),
      );
    }
  }
})();

function loadForkData(forkDir) {
  const jugs = {};
  const reagents = {};
  const reactions = {};
  let chemVendInventory = null;
  let chemDispenserInventory = null;

  const bundles = loadLocalizationBundles(forkDir);

  for (const proto of loadPrototypes(forkDir)) {
    if (proto.type === "reagent") {
      reagents[proto.id] = {
        ...proto,
        localization: Object.entries(bundles).reduce((acc, [locale, bundle]) => {
          acc[locale] = {
            name: bundle.getMessage(proto.name)?.value,
            physicalDesc: bundle.getMessage(proto.physicalDesc)?.value,
          };
          return acc;
        }, {}),
      };
    }
    if (proto.type === "reaction") {
      reactions[proto.id] = proto;
    }
    if (proto.type === "entity" && proto.parent === "Jug") {
      jugs[proto.id] = proto;
    }
    if (proto.type === "vendingMachineInventory" && proto.id === "ChemVendInventory") {
      chemVendInventory = proto.startingInventory;
    }
    if (
      proto.type === "reagentDispenserInventory" &&
      proto.id === "ChemDispenserStandardInventory"
    ) {
      chemDispenserInventory = proto.inventory;
    }
  }

  return {
    jugs,
    reagents,
    reactions,
    chemVendInventory,
    chemDispenserInventory,
  };
}

/**
 * Recursively iterates through all files in a directory.
 */
function* iterateFiles(dir, extension = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* iterateFiles(fullPath, extension);
    } else if (entry.isFile()) {
      if (extension && !fullPath.endsWith(extension)) {
        continue;
      }
      yield fullPath;
    }
  }
}

/**
 * Reads and parses YAML prototype files from a directory.
 */
function* loadPrototypes(forkDir) {
  const dir = `${forkDir}/Resources/Prototypes`;

  const ss14YamlSchema = yaml.DEFAULT_SCHEMA.extend(
    ["scalar", "sequence", "mapping"].map(
      (kind) =>
        new yaml.Type("!", {
          kind: kind,
          multi: true,
          construct(data, type) {
            return { "!type": type, data };
          },
        }),
    ),
  );

  for (const filePath of iterateFiles(dir, ".yml")) {
    const prototypes = yaml.load(fs.readFileSync(filePath, "utf8"), { schema: ss14YamlSchema });
    if (!Array.isArray(prototypes)) {
      continue;
    }

    for (const prototype of prototypes) {
      yield prototype;
    }
  }
}

/**
 * Loads localization bundles from a directory.
 */
function loadLocalizationBundles(forkDir) {
  const dir = `${forkDir}/Resources/Locale`;
  const bundles = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const locale = entry.name;
      const bundle = loadFluentBundle(locale, forkDir);
      bundles[locale] = bundle;
    }
  }
  return bundles;
}

function loadFluentBundle(locale, forkDir) {
  const dir = `${forkDir}/Resources/Locale/${locale}`;
  const bundle = new FluentBundle(locale);
  for (const filePath of iterateFiles(dir, ".ftl")) {
    const resource = new FluentResource(fs.readFileSync(filePath, "utf8"));

    const errors = bundle.addResource(resource);
    if (errors.length) {
      console.error(`Error parsing FTL file ${filePath}:`);
    }
  }
  return bundle;
}
