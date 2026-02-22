import React from "react";

const SkeletonLoader = ({ lines = 12 }) => {
    return (
        <main className="container skeleton-container">
            <div className="row">
                <div className="col-12">
                    {Array.from({ length: lines }).map((_, index) => (
                        <div key={index} className="skeleton-row">
                            <div className="skeleton-verse-number"></div>
                            <div className="skeleton-text-container">
                                <div
                                    className="skeleton-line"
                                    style={{
                                        width: `${75 + Math.random() * 25}%`,
                                    }}
                                ></div>
                                {index % 3 === 0 && (
                                    <div
                                        className="skeleton-line skeleton-line-short"
                                        style={{
                                            width: `${
                                                40 + Math.random() * 30
                                            }%`,
                                        }}
                                    ></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default SkeletonLoader;
