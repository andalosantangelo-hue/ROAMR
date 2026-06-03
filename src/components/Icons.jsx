// Lightweight stroke icon set (inherits currentColor). size via className e.g. "w-6 h-6"
const S = ({ children, className = "w-6 h-6", fill = "none", ...p }) => (
  <svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    {children}
  </svg>
);

export const Home = (p) => (<S {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></S>);
export const Activities = (p) => (<S {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></S>);
export const Tribes = (p) => (<S {...p}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 6.5a3 3 0 0 1 0 5.8" /><path d="M21 20c0-2.5-1.6-4.7-4-5.6" /></S>);
export const Market = (p) => (<S {...p}><path d="M4 9h16l-1 11H5z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></S>);
export const Premium = (p) => (<S {...p}><path d="M3 8l4 3 5-6 5 6 4-3-2 11H5z" /></S>);
export const Profile = (p) => (<S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></S>);
export const Bell = (p) => (<S {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></S>);
export const Search = (p) => (<S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></S>);
export const Filter = (p) => (<S {...p}><path d="M4 7h16M7 12h10M10 17h4" /></S>);
export const Heart = (p) => (<S {...p}><path d="M12 20s-7-4.6-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.4 12 20 12 20Z" /></S>);
export const Comment = (p) => (<S {...p}><path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12Z" /></S>);
export const Send = (p) => (<S {...p}><path d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10z" /></S>);
export const Bookmark = (p) => (<S {...p}><path d="M6 4h12v17l-6-4-6 4z" /></S>);
export const Plus = (p) => (<S {...p}><path d="M12 5v14M5 12h14" /></S>);
export const ChevronDown = (p) => (<S {...p}><path d="m6 9 6 6 6-6" /></S>);
export const More = (p) => (<S {...p}><circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/></S>);
export const Star = ({ filled, ...p }) => (<S {...p} fill={filled ? "currentColor" : "none"}><path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9z" /></S>);
export const Check = (p) => (<S {...p}><path d="m5 12 5 5 9-10" /></S>);
export const Google = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/>
    <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"/>
    <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1Z"/>
  </svg>
);
export const Apple = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8C7 7.7 5.5 8.6 4.7 10c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 3 2.3 1.2-.1 1.6-.8 3.1-.8s1.8.8 3 .8 2.1-1.1 2.9-2.3c.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.6ZM14.3 5.6c.6-.8 1-1.9.9-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.3Z"/>
  </svg>
);

export const Hiking = (p) => (<S {...p}><circle cx="13" cy="4" r="1.6" fill="currentColor" stroke="none"/><path d="M11 8l-2 4 3 2 1 5"/><path d="M11 8l3 1 2 3"/><path d="M9 12l-2 8"/><path d="M16 21V9"/></S>);
export const Water = (p) => (<S {...p}><path d="M3 8c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0"/><path d="M3 13c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0"/><path d="M3 18c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0"/></S>);
export const Bike = (p) => (<S {...p}><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-7h5l3 7"/><path d="M10 10l2-3h3"/></S>);
export const Nature = (p) => (<S {...p}><path d="M12 3l4 6h-3l3 5h-8l3-5H8z"/><path d="M12 14v6"/></S>);
export const Snow = (p) => (<S {...p}><circle cx="14" cy="4.5" r="1.4" fill="currentColor" stroke="none"/><path d="M5 20l9-4 3-5"/><path d="M11 9l3 2"/><path d="M4 17l7-3"/><path d="M17 20l-3-9"/></S>);

export const ChevronRight = (p) => (<S {...p}><path d="m9 6 6 6-6 6"/></S>);
export const Edit = (p) => (<S {...p}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></S>);
export const Gear = (p) => (<S {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 2H9.8l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1c.6.5 1.3.9 2 1.2l.4 2.5h4.4l.4-2.5c.7-.3 1.4-.7 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></S>);
export const Card = (p) => (<S {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></S>);
export const Help = (p) => (<S {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none"/></S>);
export const Info = (p) => (<S {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none"/></S>);
export const Crown = (p) => (<S {...p}><path d="M3 8l4 3 5-6 5 6 4-3-2 11H5z"/></S>);
