
import 'antd/dist/reset.css';
import { ConfigProvider } from 'antd';

export default function MyApp({ Component, pageProps }) {
  return (
    <ConfigProvider>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
