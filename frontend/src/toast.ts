import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    let background = 'linear-gradient(to right, #11998e, #38ef7d)'; // green
    if (type === 'error') {
        background = 'linear-gradient(to right, #cb2d3e, #ef473a)'; // red
    } else if (type === 'info') {
        background = 'linear-gradient(to right, #2193b0, #6dd5ed)'; // blue
    }
    
    Toastify({
        text: message,
        duration: 3500,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background,
            fontFamily: "'Barlow Condensed', sans-serif",
            textTransform: "uppercase",
            fontWeight: "600",
            letterSpacing: "0.1em",
            borderRadius: "3px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "0.8rem",
            boxShadow: "0 4px 15px rgba(0,0,0,0.35)",
            padding: "0.75rem 1.5rem"
        }
    }).showToast();
}
