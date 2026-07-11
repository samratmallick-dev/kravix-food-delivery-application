import { riderRepository } from "../repositories/index.js";
import { RiderService } from "./RiderService.js";

export const riderService = new RiderService(riderRepository);
export { riderRepository };
