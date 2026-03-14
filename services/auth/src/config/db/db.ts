import mongoose from "mongoose";
import { Resolver } from "dns/promises";
import { setDefaultResultOrder } from "dns";

setDefaultResultOrder("ipv4first");

if (!(process.env.MONGO_URI && process.env.DB_NAME)) {
      console.error("MONGO_URI and DB_NAME must be defined");
      throw new Error("MONGO_URI and DB_NAME must be defined");
}

const parseCredentials = (srvUrl: string) => {
      const match = srvUrl.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/);
      if (!match || !match[1] || !match[2]) throw new Error("Invalid MONGO_URI format");
      return { user: match[1], pass: match[2] };
};

const parseHost = (srvUrl: string) => {
      const match = srvUrl.match(/@([^/]+)/);
      if (!match || !match[1]) throw new Error("Invalid MONGO_URI: cannot parse host");
      return match[1];
};

const connectDb = async () => {
      if (mongoose.connection.readyState >= 1) return;
      try {
            const { user, pass } = parseCredentials(process.env.MONGO_URI as string);
            const clusterHost = parseHost(process.env.MONGO_URI as string);

            const resolver = new Resolver();
            resolver.setServers(["8.8.8.8", "8.8.4.4"]);

            console.log(`Resolving SRV for _mongodb._tcp.${clusterHost} via Google DNS...`);
            const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${clusterHost}`);
            const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
            console.log("Resolved hosts:", hosts);

            let replicaSet: string | null = null;
            let authSource = "admin";
            try {
                  const txtRecords = await resolver.resolveTxt(clusterHost);
                  const flat = txtRecords.flat().join("");
                  console.log("TXT Record:" as string, flat);
                  const rsMatch = flat.match(/replicaSet=([^&]+)/);
                  const asMatch = flat.match(/authSource=([^&]+)/);
                  if (rsMatch && rsMatch[1]) replicaSet = rsMatch[1];
                  if (asMatch && asMatch[1]) authSource = asMatch[1];
            } catch {
                  console.log("TXT lookup failed, using authSource=admin");
            }

            const directUrl = `mongodb://${user}:${encodeURIComponent(pass)}@${hosts}/${process.env.DB_NAME as string}`;

            const options: mongoose.ConnectOptions = {
                  tls: true,
                  authSource,
                  serverSelectionTimeoutMS: 30000,
                  socketTimeoutMS: 45000,
                  connectTimeoutMS: 30000,
            };

            if (replicaSet) {
                  (options as any).replicaSet = replicaSet;
                  console.log("Using replicaSet:", replicaSet);
            }

            console.log("Connecting with options:" as string, { ...options, hosts });
            const connectionInstance = await mongoose.connect(directUrl, options);
            console.log(`MongoDB connected successfully to host: ${connectionInstance.connection.host as string}`);

      } catch (error) {
            console.error(`MongoDB Connection Failed: ${error}`);
            throw new Error(`MongoDB Connection Failed: ${error}`);
      }
};

export default connectDb;