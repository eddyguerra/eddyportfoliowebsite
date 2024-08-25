import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { useEffect } from "react";

const App = ({ Component, pageProps }) => {
    useEffect(() => {
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
            },
            svg: {
                fontCache: 'global'
            }
        };
    }, []);

    return (
        <ThemeProvider defaultTheme="dark" attribute="class">
            <Script
                src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
                strategy="beforeInteractive"
            />
            <Component {...pageProps} />
        </ThemeProvider>
    );
};

export default App;
