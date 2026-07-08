import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { addressService } from "../services/index.js";
import { RestaurantValidator } from "../validators/restaurant.validator.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const addAddress = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const validData = RestaurantValidator.validateAddress(req.body);
  const address = await addressService.addAddress(user._id.toString(), validData);
  return successResponse(res, 201, "Address added successfully.", address);
});

export const deleteAddress = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const addressId = req.params["addressId"] as string;
  await addressService.deleteAddress(user._id.toString(), addressId);
  return successResponse(res, 200, "Address deleted successfully.");
});

export const getMyAddress = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const addresses = await addressService.getMyAddresses(user._id.toString());
  const data = addresses.map((a) => ({
    _id: a.id,
    mobile: a.mobile,
    formatedAddress: a.formatedAddress,
    longitude: a.coordinates[0],
    latitude: a.coordinates[1]
  }));

  return successResponse(res, 200, "Addresses fetched successfully.", data);
});
