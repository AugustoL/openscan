import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { networkConfig } from "./utils/networkConfig";
import App from "./App";
import { NotificationProvider } from "./context/NotificationContext";
import { AppContextProvider } from "./context/AppContext";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<React.StrictMode>
		<WagmiProvider config={networkConfig}>
			<QueryClientProvider client={queryClient}>
				<NotificationProvider>
					<AppContextProvider>
						<App />
					</AppContextProvider>
				</NotificationProvider>
			</QueryClientProvider>
		</WagmiProvider>
	</React.StrictMode>,
);
