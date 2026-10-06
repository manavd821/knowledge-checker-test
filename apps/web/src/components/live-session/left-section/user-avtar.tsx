import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, getAvatarColor, getInitials } from "@/lib/utils"

type Props = {
    name: string,
    /** extra classes for the avatar circle (size) */
    className?: string,
    /** extra classes for the initials fallback */
    fallbackClassName?: string,
}
export function UserAvtar({ name, className, fallbackClassName } : Props){
    const { bg, text } = getAvatarColor(name);
    return (
        <Avatar
        className={cn("h-10 w-10", className)}
        >
            <AvatarFallback
            className={cn(
                "text-white font-semibold border",
                bg,
                text,
                fallbackClassName,
            )}
            >{getInitials(name)}
            </AvatarFallback>
        </Avatar>
    )
}
