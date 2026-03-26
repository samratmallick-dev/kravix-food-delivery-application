export const ORDER_ACTION: Record<string, string[]> = {
      placed: ["accepted"],
      accepted: ["preparing"],
      preparing: ["ready_for_rider"]
};

export const RIDER_ORDER_TRANSITIONS: Record<string, string> = {
      rider_assigned: "picked_up",
      ready_for_rider: "picked_up",
      picked_up: "out_for_delivery",
      out_for_delivery: "reached_delivery_location",
      reached_delivery_location: "delivered",
};