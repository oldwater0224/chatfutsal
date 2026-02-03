export default function Loading ({text = '로딩중 ...'} : {text?: string}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}