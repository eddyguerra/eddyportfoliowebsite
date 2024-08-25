import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const PublicationCard = ({ title, authors, details, link }) => {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div
            className={`w-full p-2 mob:p-4 rounded-lg transition-all ease-out duration-300 ${
                mounted && theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-50"
            } hover:scale-105 link`}
        >
            <h1 className="text-3xl">
                {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                        {title ? title : "Publication Title"}
                    </a>
                ) : (
                    title ? title : "Publication Title"
                )}
            </h1>
            <p className="mt-2 text-lg">{authors ? authors : "Author(s)"}</p>
            <p className="mt-5 opacity-40 text-md">
                {details
                    ? details
                    : "Details about the publication, such as where it was published, pages, date, etc."}
            </p>
        </div>
    );
};

export default PublicationCard;
