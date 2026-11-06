import { BrowserRouter } from "react-router-dom";
<<<<<<< Updated upstream
import WorkstationApp from "./workstation/WorkstationApp.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <WorkstationApp />
    </BrowserRouter>
=======
import { queryClient } from "./lib/queryClient";
import theme from "./theme/chakraTheme";
import ThemeProvider from "./theme/ThemeProvider";
import AuthProvider from "./contexts/AuthProvider.jsx";
import DateRangeProvider from "./contexts/DateRangeContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode="dark" />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <DateRangeProvider>
              <ThemeProvider>
                <AppRoutes />
              </ThemeProvider>
            </DateRangeProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ChakraProvider>
>>>>>>> Stashed changes
  );
}
