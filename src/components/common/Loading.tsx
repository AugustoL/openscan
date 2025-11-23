import React from "react";
import "../../styles/styles.css";

const Loading = React.memo(() => (
	<div className="loading-container">
		<div className="wave-loading">
			<div className="wave"></div>
			<div className="wave"></div>
			<div className="wave"></div>
		</div>
	</div>
));

Loading.displayName = "Loading";

export default Loading;
