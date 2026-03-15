import type { IRestaurant } from "../../types/types";

interface props {
      restaurant: IRestaurant;
};

const RestaurantProfile = ({restaurant}: props) => {
      console.log(restaurant);
      
      return (
            <div className="w-full min-h">

            </div>
      );
};

export default RestaurantProfile;
