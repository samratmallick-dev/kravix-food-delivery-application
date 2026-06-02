import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Address } from "../model/Address.js";

export const addAddress = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;

            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const { mobile, formattedAddress, latitude, longitude } = req.body;

            if (
                  !mobile ||
                  !formattedAddress ||
                  latitude === undefined ||
                  longitude === undefined
            ) {
                  return res.status(400).json({
                        message: "All fields are required",
                        error: true,
                        success: false,
                  });
            }

            const address = await Address.create({
                  userId: user._id,
                  mobile,
                  formatedAddress: formattedAddress,
                  location: {
                        type: "Point",
                        coordinates: [Number(longitude), Number(latitude)],
                  },
            });

            return res.status(201).json({
                  message: "Address added successfully.",
                  data: address,
                  error: false,
                  success: true,
            });
      },
);

export const deleteAddress = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;

            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const { addressId } = req.params;

            if (!addressId) {
                  return res.status(400).json({
                        message: "Address id is required",
                        error: true,
                        success: false,
                  });
            }

            const address = await Address.findByIdAndDelete(addressId);

            if (!address) {
                  return res.status(404).json({
                        message: "Address not found",
                        error: true,
                        success: false,
                  });
            }

            return res.status(200).json({
                  message: "Address deleted successfully.",
                  data: address,
                  error: false,
                  success: true,
            });
      },
);

export const getMyAddress = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;

            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const addresses = await Address.find({ userId: user._id.toString() }).sort({
                  createdAt: -1,
            });

            const data = addresses.map((a) => ({
                  _id: a._id,
                  mobile: a.mobile,
                  formatedAddress: a.formatedAddress,
                  longitude: a.location.coordinates[0],
                  latitude: a.location.coordinates[1],
            }));

            return res.status(200).json({
                  message: "Addresses fetched successfully.",
                  data,
                  error: false,
                  success: true,
            });
      },
);
