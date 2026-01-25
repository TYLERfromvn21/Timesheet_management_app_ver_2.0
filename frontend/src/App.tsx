import { RouterProvider } from "react-router-dom";
import { router } from "./routes"; // Import cái bản đồ router nãy mình tạo

// Nếu bạn chưa tạo file globals.css thì bỏ dòng này đi cũng được
// import "./styles/globals.css"; 

function App() {
  return (
    // RouterProvider sẽ thay thế toàn bộ giao diện cũ bằng các trang (Pages) thật sự
    <RouterProvider router={router} />
  );
}

export default App;