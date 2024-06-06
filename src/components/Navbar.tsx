import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-backgroundAlt text-text shadow-lg h-14">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between space-x-7">
          <div>
            <Link href="/" className="flex items-center py-4 px-2">
              <span className="font-semibold text-lg  hover:text-accent transition duration-300">
                Jack Rowe
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            <Link
              href="/"
              className="py-4 px-2 font-semibold hover:text-accent transition duration-300"
            >
              Home
            </Link>
            <Link
              href="/resume"
              className="py-4 px-2 font-semibold hover:text-accent transition duration-300"
            >
              Resume
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
