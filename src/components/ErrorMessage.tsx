export default function ErrorMessage({ message }: { message: string }) {
    return (
      <div className="text-red-400 p-4 bg-red-950 rounded-lg border border-red-700">
        {message}
      </div>
    );
  }
  