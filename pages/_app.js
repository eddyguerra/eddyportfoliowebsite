import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { useEffect } from 'react';
import Script from 'next/script';

const App = ({ Component, pageProps }) => {
    useEffect(() => {
        // MathJax configuration
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
            },
            svg: {
                fontCache: 'global',
            },
        };
    }, []);

    return (
        <ThemeProvider defaultTheme="dark" attribute="class">
            {/* Add MathJax script */}
            <Script
                id="mathjax-script"
                strategy="beforeInteractive"
                src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
            />
            <Component {...pageProps} />
        </ThemeProvider>
    );
};

export default App;
