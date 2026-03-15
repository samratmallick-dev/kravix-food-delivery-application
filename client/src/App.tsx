import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import SelectRole from "./pages/select-role";
import ProtectedRoutes from "./components/common/protectedRoutes";
import PublicRoutes from "./components/common/publicRoutes";
import Navbar from "./components/navbar/navbar";
import Account from "./pages/account";

const App = () => {
      
      return (
            <BrowserRouter>
                  <Navbar />
                  <Routes>
                        <Route element={<PublicRoutes />}>
                              <Route path="/login" element={<Login />} />
                        </Route>
                        <Route element={<ProtectedRoutes />}>
                              <Route path="/" element={<Home />} />
                              <Route path="/select-role" element={<SelectRole />} />
                              <Route path="/account" element={<Account />}/>
                        </Route>
                  </Routes>
            </BrowserRouter>
      );
}

export default App;
