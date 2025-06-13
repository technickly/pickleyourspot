export default function PickleballIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-12 text-primary"
    >
      {/* Paddle */}
      <path d="M19 8h-2V6c0-1.1-.9-2-2-2H9C7.9 4 7 4.9 7 6v2H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z" fill="currentColor"/>
      {/* Ball */}
      <circle cx="12" cy="12" r="3" fill="white" stroke="currentColor" strokeWidth="1"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  );
} 