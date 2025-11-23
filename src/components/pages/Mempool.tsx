import { useParams } from "react-router-dom";

export default function Mempool() {
	const { chainId, filter } = useParams<{
		chainId?: string;
		filter?: string;
	}>();

	return (
		<div>
			<h1>Mempool</h1>
			<p>chainId: {chainId ?? "none"}</p>
			<p>filter: {filter ?? "none"}</p>
		</div>
	);
}
