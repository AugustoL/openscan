import { useState } from "react";
import JSZip from "jszip";

export function useZipJsonReader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function processZip(file: File) {
    setLoading(true);
    setError(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const results: any = {};
      const entries = Object.keys(zip.files);
      console.log(entries)

      for (const path of entries) {
        const zipFile = zip.files[path]
        if(!zipFile) continue;
        if (
          path.includes("ignition/deployments/") && 
          path.includes("artifacts") && 
          path.endsWith(".json") && 
          !zipFile.dir
          ) {
            const key = zipFile.name.split("#")[1]
            if (!key) continue;
            results[key] = JSON.parse(await zipFile.async("string") );
            
            // Add build info file into big object
            const buildInfoPath = entries.find((e) => e.includes(results[key].buildInfoId))
            const buildInfoFile = zip.files[buildInfoPath!]
            if (!buildInfoFile) continue;
            const buildInfo = JSON.parse(await buildInfoFile.async("string") );
            results[key]["buildInfo"] = buildInfo

            // Add source code files into big object
            const sourceCodePath = entries.find((e) => e.includes(results[key].sourceName))
            const sourceCodeFile = zip.files[sourceCodePath!]
            if (!sourceCodeFile) continue;
            const sourceCode = await sourceCodeFile.async("string");
            results[key]["sourceCode"] = sourceCode
          }
      }


      // for (const path of entries) {
      //   console.log(path)
      //   const zipFile = zip.files[path];
      //   if (!zipFile) continue;

      //   // Only process .json files, skip directories
      //   if (path.endsWith(".json") && !zipFile.dir) {

      //     try {
      //       const content = await zipFile.async("string");
      //       results[path] = JSON.parse(content);
      //     } catch (err) {
      //       console.error("Invalid JSON in:", path, err);
      //       setError(`Failed to parse JSON in ${path}`);
      //     }
      //   }

      //   if (path.endsWith(".sol") && !zipFile.dir) {

      //   }
      // }

      setLoading(false);
      console.log(results)
      return results;
    } catch (err) {
      console.error("Failed to process ZIP file:", err);
      setError("Failed to process ZIP file. Please ensure it's a valid ZIP archive.");
      setLoading(false);
      return {};
    }
  }

  return { processZip, loading, error };
}
