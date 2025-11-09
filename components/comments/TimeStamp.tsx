'use client';
import { useState, useEffect } from 'react';
export default function TimeStamp({ date }: { date: Date }) {
const [displayTime, setDisplayTime] = useState('');
useEffect(() => {
const updateDisplayTime = () => {
const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
if (seconds < 5) { setDisplayTime("للتو"); return; }
if (seconds < 60) { setDisplayTime(`منذ ${Math.floor(seconds)} ثوانٍ`); return; }
const minutes = seconds / 60;
if (minutes < 60) { setDisplayTime(`منذ ${Math.floor(minutes)} دقائق`); return; }
const hours = minutes / 60;
if (hours < 24) { setDisplayTime(`منذ ${Math.floor(hours)} ساعات`); return; }
setDisplayTime(new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
};
updateDisplayTime();
const interval = setInterval(updateDisplayTime, 30000); // update every 30 seconds
return () => clearInterval(interval);
}, [date]);
return <p className="comment-timestamp">{displayTime}</p>;
}


