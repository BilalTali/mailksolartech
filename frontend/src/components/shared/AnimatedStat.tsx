import { useEffect, useState, useRef } from 'react';

export default function AnimatedStat({ valueString, className }: { valueString: string, className?: string }) {
    const [count, setCount] = useState(0);
    const targetRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    // Parse numeric and string segments safely
    const numMatch = valueString.match(/[\d,]+/);
    const numberRaw = numMatch ? numMatch[0].replace(/,/g, '') : "0";
    const targetValue = parseInt(numberRaw, 10);
    const prefix = numMatch && numMatch.index !== undefined ? valueString.substring(0, numMatch.index) : "";
    const suffix = numMatch && numMatch.index !== undefined ? valueString.substring(numMatch.index + numMatch[0].length) : valueString;

    useEffect(() => {
        if (!targetRef.current || isNaN(targetValue) || targetValue <= 5) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    let startTime: number;
                    const duration = 2000;

                    const step = (currentTime: number) => {
                        if (!startTime) startTime = currentTime;
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease Out Expo logic for a premium slow-down finish
                        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                        
                        setCount(Math.floor(easeOut * targetValue));
                        
                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else {
                            setCount(targetValue);
                        }
                    };
                    requestAnimationFrame(step);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(targetRef.current);
        return () => observer.disconnect();
    }, [targetValue]);

    if (isNaN(targetValue) || targetValue <= 5) {
        return <div className={className}>{valueString}</div>;
    }

    const displayCount = count.toLocaleString('en-IN');

    return (
        <div ref={targetRef} className={className}>
            {prefix}{displayCount}{suffix}
        </div>
    );
}
