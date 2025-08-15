import {IoMdClose} from "react-icons/io";
import {twMerge} from "tailwind-merge";
import {Input} from "@/components/ui/input.js";

const Search = ({searchQuery, setSearchQuery, ...props}) => {
  return (
    <div className={twMerge("relative", props?.className)}>
      <Input
        placeholder={props?.placeholder || "Search..."}
        value={searchQuery || ""}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pe-9"
      />
      <button
        className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Subscribe"
        onClick={(event) => {
          event.preventDefault();
          setSearchQuery("")
        }}>
        <IoMdClose className={""}/>
      </button>
    </div>
  );
}
export default Search
