import Image from "next/image";
import Link from "next/link";

interface Props {
    title: string;
    image: string;
    slug: string;
    location: string;
    date: string;
    time: string;
    price?: number;
    mode?: string;
}

const EventCard = ({ title, image, slug, location, date, time, price, mode }: Props) => {
    return (
        <Link href={`/events/${slug}`} id="event-card" className="glass hover:bg-dark-200/60 transition-all">
            <Image src={image} alt={title} width={410} height={300} className="poster" />
            <div className="flex flex-row gap-2">
                <Image src='/icons/pin.svg' alt="location" width={14} height={14} />
                <p className="location">{location}</p>
            </div>
            <p className="title">{title}</p>

            <div className="datetime">
                <div>
                    <Image src='/icons/calendar.svg' alt="calendar" width={14} height={14} />
                    <p className="date">{date}</p>
                </div>
                <div>
                    <Image src='/icons/clock.svg' alt="clock" width={14} height={14} />
                    <p className="time">{time}</p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-dark">
                {mode && (
                    <span className="text-xs px-2 py-1 rounded bg-dark-200 text-gray-300 capitalize">
                        {mode}
                    </span>
                )}
                {price !== undefined && (
                    <span className={`text-sm font-semibold ${price === 0 ? 'text-green-500' : 'text-primary'}`}>
                        {price === 0 ? 'FREE' : `₹${price}`}
                    </span>
                )}
            </div>
        </Link >
    )
}

export default EventCard