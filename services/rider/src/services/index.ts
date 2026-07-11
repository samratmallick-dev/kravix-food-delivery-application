import { RiderRepository } from "../repositories/rider.repository.js";
import { RiderService } from "./RiderService.js";

export const riderRepository = new RiderRepository();
export const riderService = new RiderService(riderRepository);
