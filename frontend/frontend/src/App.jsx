
import "./App.css";

import RouterPage from "./routes/router";
import { ThemeProvider } from "./routes/ThemeContext";

function App() {
  return(
    <ThemeProvider>
      <RouterPage/>
    </ThemeProvider>
  )
}
export default App;
