import MiniPuttCanvas from "./_components/MiniPuttCanvas";

export default function MiniPuttPage() {
    return (
        <div className="font-clash relative min-h-screen flex flex-col items-center justify-center px-8 gap-6">
            <h1 className="text-3xl font-bold text-white">Mini Putt</h1>
            <MiniPuttCanvas />
        </div>
    );
}