import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { addressService } from "../services/index.js";
import { RestaurantValidator } from "../validators/restaurant.validator.js";

export const addAddress = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const validData = RestaurantValidator.validateAddress(req.body);
  const address = await addressService.addAddress(user._id.toString(), validData);

  return res.status(201).json({
    message: "Address added successfully.",
    data: address,
    error: false,
    success: true
  });
});

export const deleteAddress = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const addressId = req.params["addressId"] as string;
  await addressService.deleteAddress(user._id.toString(), addressId);

  return res.status(200).json({
    message: "Address deleted successfully.",
    error: false,
    success: true
  });
});

export const getMyAddress = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const addresses = await addressService.getMyAddresses(user._id.toString());
  const data = addresses.map((a) => ({
    _id: a.id,
    mobile: a.mobile,
    formatedAddress: a.formatedAddress,
    longitude: a.coordinates[0],
    latitude: a.coordinates[1]
  }));

  return res.status(200).json({
    message: "Addresses fetched successfully.",
    data,
    error: false,
    success: true
  });
});
