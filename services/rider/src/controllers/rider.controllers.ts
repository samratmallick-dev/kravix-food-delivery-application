import axios from "axios";
import { Response } from "express";
import { getBuffer } from "../config/datauri.js";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Rider } from "../model/Rider.js";

export const updateRiderProfile = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });
            }
            if (user.role !== "rider") {
                  return res.status(403).json({
                        success: false,
                        message: "Access denied. Riders only.",
                        error: true,
                  });
            }
            const riderProfile = await Rider.findOne({ userId: user._id });
            if (!riderProfile) {
                  return res.status(404).json({
                        success: false,
                        message: "Rider profile not found",
                        error: true,
                  });
            }

            const { phoneNumber, aadhaarNumber, drivingLicesce } = req.body;
            const updates: {
                  picture?: string;
                  phoneNumber?: string;
                  aadhaarNumber?: string;
                  drivingLicesce?: string;
            } = {};

            if (phoneNumber) updates.phoneNumber = phoneNumber;
            if (aadhaarNumber) updates.aadhaarNumber = aadhaarNumber;
            if (drivingLicesce) updates.drivingLicesce = drivingLicesce;

            const file = req.file;
            if (file) {
                  const fileBuffer = getBuffer(file);
                  if (!fileBuffer)
                        return res.status(500).json({
                              success: false,
                              message: "Error processing the image file",
                              error: true,
                        });

                  const { data: uploadResult } = await axios.post(
                        `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
                        { image: fileBuffer },
                        {
                              headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! },
                        },
                  );
                  updates.picture = uploadResult.url;
            } else if (req.body.pictureUrl) {
                  updates.picture = req.body.pictureUrl;
            }

            if (Object.keys(updates).length === 0) {
                  return res
                        .status(400)
                        .json({ success: false, message: "No fields to update", error: true });
            }

            const updated = await Rider.findOneAndUpdate(
                  { userId: user._id },
                  updates,
                  { new: true },
            );

            return res.status(200).json({
                  success: true,
                  message: "Rider profile updated successfully",
                  error: false,
                  data: updated,
            });
      },
);

export const addRiderProfile = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });
            if (user.role !== "rider")
                  return res.status(403).json({
                        success: false,
                        message: "Access denied. Riders only.",
                        error: true,
                  });

            const { phoneNumber, aadhaarNumber, drivingLicesce, latitude, longitude } =
                  req.body;

            if (
                  !phoneNumber ||
                  !aadhaarNumber ||
                  !drivingLicesce ||
                  latitude === undefined ||
                  longitude === undefined
            ) {
                  return res.status(400).json({
                        success: false,
                        message: "All fields are required",
                        error: true,
                  });
            }

            const { pictureUrl } = req.body;
            let resolvedPictureUrl: string;

            if (pictureUrl) {
                  resolvedPictureUrl = pictureUrl;
            } else {
                  const file = req.file;
                  if (!file)
                        return res.status(400).json({
                              success: false,
                              message: "Rider Profile image is required",
                              error: true,
                        });

                  const fileBuffer = getBuffer(file);
                  if (!fileBuffer)
                        return res.status(500).json({
                              success: false,
                              message: "Error processing the image file",
                              error: true,
                        });

                  const { data: uploadResult } = await axios.post(
                        `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
                        { image: fileBuffer },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  );
                  resolvedPictureUrl = uploadResult.url;
            }

            const lat = Number(latitude);
            const lng = Number(longitude);
            if (isNaN(lat) || isNaN(lng))
                  return res.status(400).json({
                        success: false,
                        message: "Latitude and longitude must be valid numbers",
                        error: true,
                  });

            const existingRiderProfile = await Rider.findOne({ userId: user._id });
            if (existingRiderProfile)
                  return res.status(409).json({
                        success: false,
                        message: "Rider profile already exists",
                        error: true,
                  });

            const riderProfile = await Rider.create({
                  userId: user._id,
                  picture: resolvedPictureUrl,
                  phoneNumber,
                  aadhaarNumber,
                  drivingLicesce,
                  location: { type: "Point", coordinates: [lng, lat] },
            });

            return res.status(201).json({
                  success: true,
                  message: "Rider profile created successfully",
                  error: false,
                  data: riderProfile,
            });
      },
);

export const fetchMyProfile = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });
            if (user.role !== "rider")
                  return res.status(403).json({
                        success: false,
                        message: "Access denied. Riders only.",
                        error: true,
                  });

            const riderProfile = await Rider.findOne({ userId: user._id });
            if (!riderProfile)
                  return res.status(404).json({
                        success: false,
                        message: "Rider profile not found",
                        error: true,
                  });

            const [storedLng, storedLat] = riderProfile.location.coordinates;

            return res.status(200).json({
                  success: true,
                  message: "Rider profile fetched successfully",
                  error: false,
                  data: {
                        ...riderProfile.toObject(),
                        location: {
                              type: "Point",
                              coordinates: [storedLng, storedLat],
                              longitude: storedLng,
                              latitude: storedLat,
                        },
                  },
            });
      },
);

export const toggleRiderAvailability = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });
            if (user.role !== "rider")
                  return res.status(403).json({
                        success: false,
                        message: "Access denied. Riders only.",
                        error: true,
                  });

            const riderProfile = await Rider.findOne({ userId: user._id });
            if (!riderProfile)
                  return res.status(404).json({
                        success: false,
                        message: "Rider profile not found",
                        error: true,
                  });

            const { isAvailable, latitude, longitude } = req.body;

            if (latitude === undefined || longitude === undefined)
                  return res
                        .status(400)
                        .json({ success: false, message: "Location is required", error: true });

            const lat = Number(latitude);
            const lng = Number(longitude);
            if (isNaN(lat) || isNaN(lng))
                  return res.status(400).json({
                        success: false,
                        message: "Latitude and longitude must be valid numbers",
                        error: true,
                  });
            if (typeof isAvailable !== "boolean")
                  return res.status(400).json({
                        success: false,
                        message: "Invalid availability status",
                        error: true,
                  });
            if (isAvailable && !riderProfile.isVerified)
                  return res.status(403).json({
                        success: false,
                        message: "You need to be verified to go online",
                        error: true,
                  });

            riderProfile.isAvailable = isAvailable;
            riderProfile.location = { type: "Point", coordinates: [lng, lat] };
            riderProfile.lastActiveAt = new Date();
            await riderProfile.save();

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "admin:rider:availability",
                              room: "Admin",
                              payload: { riderId: riderProfile._id.toString(), isAvailable },
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  )
                  .catch((err) => console.error("Admin socket emit failed:", err.message));

            return res.status(200).json({
                  success: true,
                  message: `Rider is now ${isAvailable ? "available" : "unavailable"}`,
                  error: false,
                  data: riderProfile,
            });
      },
);

export const acceptOrder = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const riderUserId = req.user?._id;
            if (!riderUserId)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });

            const { orderId } = req.params;

            const rider = await Rider.findOneAndUpdate(
                  { userId: riderUserId.toString(), isAvailable: true, isVerified: true },
                  { isAvailable: false },
                  { new: true },
            );

            if (!rider) {
                  return res.status(409).json({
                        success: false,
                        message: "You are no longer available or already on a delivery",
                        error: true,
                  });
            }

            try {
                  const { data } = await axios.patch(
                        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/rider-assignment`,
                        {
                              orderId,
                              riderId: rider._id.toString(),
                              riderUserId: rider.userId,
                              riderName: req.user?.name,
                              riderPhoneNumber: rider.phoneNumber,
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  );

                  if (!data.success) throw new Error(data.message);

                  return res.status(200).json({
                        success: true,
                        message: "Order accepted successfully",
                        error: false,
                        data: rider,
                  });
            } catch (error: any) {
                  await Rider.findOneAndUpdate({ _id: rider._id }, { isAvailable: true });
                  return res.status(400).json({
                        success: false,
                        message:
                              error instanceof Error ? error.message : "Failed to accept order",
                        error: true,
                  });
            }
      },
);

export const fetchCurrentOrder = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const riderUserId = req.user?._id;
            if (!riderUserId)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });

            const rider = await Rider.findOne({
                  userId: riderUserId.toString(),
                  isVerified: true,
            });
            if (!rider)
                  return res.status(404).json({
                        success: false,
                        message: "Rider profile not found",
                        error: true,
                  });

            try {
                  const { data } = await axios.get(
                        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/current?riderId=${rider._id.toString()}`,
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  );
                  if (data.success) {
                        return res.status(200).json({
                              success: true,
                              message: "Current order fetched successfully",
                              error: false,
                              data: data.data,
                        });
                  }
                  return res.status(404).json({
                        success: false,
                        message: "No current order found",
                        error: true,
                        data: null,
                  });
            } catch (error: any) {
                  if (error?.response?.status === 404) {
                        return res.status(404).json({
                              success: false,
                              message: "No current order found",
                              error: true,
                              data: null,
                        });
                  }
                  return res.status(500).json({
                        success: false,
                        message:
                              error?.response?.data?.message ??
                              error?.message ??
                              "Failed to fetch current order",
                        error: true,
                  });
            }
      },
);

export const updateOrderStatus = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const riderUserId = req.user?._id;
            if (!riderUserId)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });

            const rider = await Rider.findOne({
                  userId: riderUserId.toString(),
                  isVerified: true,
            });
            if (!rider)
                  return res.status(404).json({
                        success: false,
                        message: "Rider profile not found",
                        error: true,
                  });

            const { orderId, latitude, longitude, otp, codPaymentMode } = req.body;

            const [riderLng, riderLat] = rider.location.coordinates;
            const effectiveLat = latitude !== undefined ? Number(latitude) : riderLat;
            const effectiveLng = longitude !== undefined ? Number(longitude) : riderLng;

            if (otp !== undefined) {
                  if (!rider.deliveryOtp || !rider.deliveryOtpExpiry) {
                        return res.status(400).json({
                              success: false,
                              message: "No OTP generated for this delivery",
                              error: true,
                        });
                  }
                  if (new Date() > rider.deliveryOtpExpiry) {
                        return res.status(400).json({
                              success: false,
                              message: "OTP has expired. Please request a new one.",
                              error: true,
                        });
                  }
                  if (rider.deliveryOtp !== String(otp)) {
                        return res
                              .status(400)
                              .json({ success: false, message: "Invalid OTP", error: true });
                  }
            }

            try {
                  const { data } = await axios.patch(
                        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/status`,
                        {
                              orderId,
                              riderId: rider._id.toString(),
                              riderLat: effectiveLat,
                              riderLng: effectiveLng,
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  );

                  if (data.data?.status === "delivered") {
                        if (
                              data.data?.paymentMethod === "cod" &&
                              data.data?.paymentStatus === "cod_pending"
                        ) {
                              if (!codPaymentMode || !["cash", "upi", "card", "wallet"].includes(codPaymentMode)) {
                                    return res.status(400).json({
                                          success: false,
                                          message: "Payment mode is required for COD orders",
                                          error: true,
                                    });
                              }
                              await axios.patch(
                                    `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/cod-payment`,
                                    { orderId, codPaymentMode },
                                    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                              );
                        }

                        await Rider.findOneAndUpdate(
                              { _id: rider._id },
                              {
                                    isAvailable: false,
                                    deliveryOtp: null,
                                    deliveryOtpExpiry: null,
                                    $inc: {
                                          totalDeliveries: 1,
                                          totalEarnings: data.data?.riderAmount ?? 0,
                                    },
                              },
                        );
                        await axios
                              .patch(
                                    `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/set-otp`,
                                    { orderId, otp: null },
                                    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                              )
                              .catch(() => { });
                  }

                  return res.status(200).json({
                        success: true,
                        message: "Order status updated successfully",
                        error: false,
                        data: data.data,
                  });
            } catch (error: any) {
                  return res.status(error?.response?.status ?? 500).json({
                        success: false,
                        message:
                              error?.response?.data?.message ??
                              error?.message ??
                              "Failed to update order status",
                        error: true,
                  });
            }
      },
);

export const generateDeliveryOtp = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const riderUserId = req.user?._id;
            if (!riderUserId)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });

            const rider = await Rider.findOne({
                  userId: riderUserId.toString(),
                  isVerified: true,
            });
            if (!rider)
                  return res.status(404).json({
                        success: false,
                        message: "Rider profile not found",
                        error: true,
                  });

            const { orderId } = req.body;
            if (!orderId)
                  return res
                        .status(400)
                        .json({ success: false, message: "Order ID is required", error: true });

            const { data: orderData } = await axios.get(
                  `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/${orderId}`,
                  { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
            );

            if (
                  !orderData.success ||
                  orderData.data?.riderId !== rider._id.toString()
            ) {
                  return res.status(403).json({
                        success: false,
                        message: "You are not assigned to this order",
                        error: true,
                  });
            }

            const otp = String(Math.floor(100000 + Math.random() * 900000));
            const expiry = new Date(Date.now() + 10 * 60 * 1000);

            rider.deliveryOtp = otp;
            rider.deliveryOtpExpiry = expiry;
            await rider.save();

            await axios.patch(
                  `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/set-otp`,
                  { orderId, otp },
                  { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
            );

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "delivery:otp",
                              room: `User:${orderData.data.userId}`,
                              payload: { orderId, otp },
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  )
                  .catch((err) => console.error("OTP socket emit failed:", err.message));

            return res.status(200).json({
                  success: true,
                  message: "OTP generated and sent to customer",
                  error: false,
            });
      },
);

export const updateLiveLocation = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const riderUserId = req.user?._id;
            if (!riderUserId)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });

            const { latitude, longitude, orderId, customerUserId } = req.body;
            if (!latitude || !longitude || !orderId || !customerUserId) {
                  return res.status(400).json({
                        success: false,
                        message: "latitude, longitude, orderId and customerUserId are required",
                        error: true,
                  });
            }

            const lat = Number(latitude);
            const lng = Number(longitude);
            if (isNaN(lat) || isNaN(lng))
                  return res
                        .status(400)
                        .json({ success: false, message: "Invalid coordinates", error: true });

            await Rider.findOneAndUpdate(
                  { userId: riderUserId.toString() },
                  {
                        location: { type: "Point", coordinates: [lng, lat] },
                        lastActiveAt: new Date(),
                  },
            );

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "rider:location",
                              room: `User:${customerUserId}`,
                              payload: { latitude: lat, longitude: lng, orderId },
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  )
                  .catch((err) =>
                        console.error("Location socket emit failed:", err.message),
                  );

            return res.status(200).json({ success: true, error: false });
      },
);

export const fetchEarnings = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const riderUserId = req.user?._id;
            if (!riderUserId)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });

            const rider = await Rider.findOne({
                  userId: riderUserId.toString(),
                  isVerified: true,
            }).select("totalEarnings totalDeliveries rating ratingCount");
            if (!rider)
                  return res.status(404).json({
                        success: false,
                        message: "Rider profile not found",
                        error: true,
                  });

            try {
                  const { data } = await axios.get(
                        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/delivery-history?riderId=${rider._id.toString()}`,
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  );

                  const orders: any[] = data.data?.orders ?? [];
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const weekAgo = new Date(today);
                  weekAgo.setDate(weekAgo.getDate() - 6);

                  const todayEarnings = orders
                        .filter((o) => new Date(o.createdAt) >= today)
                        .reduce((sum, o) => sum + (o.riderAmount ?? 0), 0);

                  const weekEarnings = orders
                        .filter((o) => new Date(o.createdAt) >= weekAgo)
                        .reduce((sum, o) => sum + (o.riderAmount ?? 0), 0);

                  const getLocalDateString = (d: Date) => {
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  };

                  const dailyMap: Record<string, number> = {};
                  for (let i = 6; i >= 0; i--) {
                        const d = new Date(today);
                        d.setDate(d.getDate() - i);
                        dailyMap[getLocalDateString(d)] = 0;
                  }
                  orders.forEach((o) => {
                        const day = getLocalDateString(new Date(o.createdAt));
                        if (day in dailyMap) dailyMap[day] += o.riderAmount ?? 0;
                  });
                  const weeklyBreakdown = Object.entries(dailyMap).map(
                        ([date, amount]) => ({ date, amount }),
                  );

                  return res.status(200).json({
                        success: true,
                        message: "Earnings fetched successfully",
                        error: false,
                        data: {
                              totalEarnings: rider.totalEarnings,
                              totalDeliveries: rider.totalDeliveries,
                              rating:
                                    rider.ratingCount > 0
                                          ? +(rider.rating / rider.ratingCount).toFixed(1)
                                          : null,
                              todayEarnings,
                              weekEarnings,
                              weeklyBreakdown,
                        },
                  });
            } catch (error: any) {
                  return res.status(500).json({
                        success: false,
                        message: error?.message ?? "Failed to fetch earnings",
                        error: true,
                  });
            }
      },
);

export const fetchDeliveryHistory = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const riderUserId = req.user?._id;
            if (!riderUserId)
                  return res.status(401).json({
                        success: false,
                        message: "User not authenticated",
                        error: true,
                  });

            const rider = await Rider.findOne({
                  userId: riderUserId.toString(),
                  isVerified: true,
            });
            if (!rider)
                  return res.status(404).json({
                        success: false,
                        message: "Rider profile not found",
                        error: true,
                  });

            try {
                  const { data } = await axios.get(
                        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/delivery-history?riderId=${rider._id.toString()}`,
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } },
                  );
                  return res.status(200).json({
                        success: true,
                        message: "Delivery history fetched successfully",
                        error: false,
                        data: data.data,
                  });
            } catch (error: any) {
                  return res.status(error?.response?.status ?? 500).json({
                        success: false,
                        message:
                              error?.response?.data?.message ??
                              error?.message ??
                              "Failed to fetch delivery history",
                        error: true,
                  });
            }
      },
);
