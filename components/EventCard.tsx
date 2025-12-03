import Image from "next/image";
import Link from "next/link";

interface Props {
    title: string;
    image: string;
    slug: string;
    location: string;
    date: string;
    time: string;
}

const EventCard = ({ title, image, slug, location, date, time }: Props) => {
    return (
        <Link href="/events" id="event-card">
            <Image src={image} alt={title} width={410} height={300} className="poster" />
            <div className="details">
                <p className="location">{location}</p>
                <p className="title">{title}</p>
                <div className="flex gap-20">
                    <p className="date">{date}</p>
                    <p className="time">{time}</p>
                </div>
            </div>
        </Link >
    )
}

export default EventCard