const dns = require("node:dns").promises;
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const mongoose = require("mongoose");

const execFileAsync = promisify(execFile);

const parseTxtOptions = (records = []) =>
  records
    .flat()
    .flatMap((record) => record.split("&"))
    .reduce((options, pair) => {
      const [key, value] = pair.split("=");

      if (key && value) {
        options[key] = value;
      }

      return options;
    }, {});

const resolveAtlasRecordsWithNode = async (srvHost) => {
  const [srvRecords, txtRecords] = await Promise.all([
    dns.resolveSrv(`_mongodb._tcp.${srvHost}`),
    dns.resolveTxt(srvHost).catch(() => []),
  ]);

  return {
    srvRecords: srvRecords.map((record) => ({
      host: record.name,
      port: record.port,
    })),
    txtOptions: parseTxtOptions(txtRecords),
  };
};

const resolveAtlasRecordsWithPowerShell = async (srvHost) => {
  const srvCommand = `
    $records = Resolve-DnsName -Type SRV _mongodb._tcp.${srvHost} |
      Select-Object NameTarget,Port |
      ConvertTo-Json -Compress;
    Write-Output $records
  `;

  const txtCommand = `
    $records = Resolve-DnsName -Type TXT ${srvHost} |
      Select-Object -ExpandProperty Strings |
      ConvertTo-Json -Compress;
    Write-Output $records
  `;

  const [{ stdout: srvStdout }, { stdout: txtStdout }] = await Promise.all([
    execFileAsync("powershell.exe", ["-NoProfile", "-Command", srvCommand]),
    execFileAsync("powershell.exe", ["-NoProfile", "-Command", txtCommand]).catch(
      () => ({ stdout: "[]" }),
    ),
  ]);

  const parsedSrvRecords = JSON.parse(srvStdout.trim());
  const parsedTxtRecords = JSON.parse(txtStdout.trim() || "[]");
  const srvList = Array.isArray(parsedSrvRecords)
    ? parsedSrvRecords
    : [parsedSrvRecords];
  const txtList = Array.isArray(parsedTxtRecords)
    ? parsedTxtRecords
    : [parsedTxtRecords];

  return {
    srvRecords: srvList.map((record) => ({
      host: record.NameTarget,
      port: Number(record.Port),
    })),
    txtOptions: parseTxtOptions(txtList.map((record) => [record])),
  };
};

const buildDirectAtlasUri = async (mongoUri) => {
  const parsed = new URL(mongoUri);
  const srvHost = parsed.host;
  const dbName = parsed.pathname.replace(/^\//, "") || "test";
  const baseOptions = Object.fromEntries(parsed.searchParams.entries());

  let resolvedRecords;

  try {
    resolvedRecords = await resolveAtlasRecordsWithNode(srvHost);
  } catch (error) {
    if (process.platform !== "win32") {
      throw error;
    }

    resolvedRecords = await resolveAtlasRecordsWithPowerShell(srvHost);
  }

  const mergedOptions = {
    tls: "true",
    ...resolvedRecords.txtOptions,
    ...baseOptions,
  };

  const queryString = new URLSearchParams(mergedOptions).toString();
  const credentials = `${encodeURIComponent(parsed.username)}:${encodeURIComponent(parsed.password)}`;
  const hosts = resolvedRecords.srvRecords
    .map((record) => `${record.host}:${record.port}`)
    .join(",");

  return `mongodb://${credentials}@${hosts}/${dbName}?${queryString}`;
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (
      mongoUri?.startsWith("mongodb+srv://") &&
      /querySrv ECONNREFUSED/i.test(error.message || "")
    ) {
      try {
        console.warn(
          "MongoDB SRV lookup failed in Node. Retrying with a direct Atlas connection string...",
        );

        const directUri = await buildDirectAtlasUri(mongoUri);
        const conn = await mongoose.connect(directUri);
        console.log(`MongoDB Connected via direct URI: ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(
          `Error connecting to MongoDB via direct URI: ${fallbackError.message}`,
        );
        process.exit(1);
      }
    }

    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
