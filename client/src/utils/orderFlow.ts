export const ORDER_ACTION : Record<string, string[]> = {
      placed: ["accepted"],
      accepted: ["preparing"],
      preparing: ["ready_for_rider"]
};