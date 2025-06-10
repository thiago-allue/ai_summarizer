
import dynamic from 'next/dynamic';

// Render the heavy AntD page only on the client to avoid SSR ESM issues
export default dynamic(() => import('../components/SummarizerPage'), { ssr: false });
