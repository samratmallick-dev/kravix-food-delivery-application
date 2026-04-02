import DataUriParser from "datauri/parser.js";
import path from "path";

export const getBuffer = (file:any) => {

      const parser = new DataUriParser();

      const extensionName = path.extname(file.originalname).toString(); 
      const dataUri = parser.format(extensionName, file.buffer);

      return dataUri?.content;
};