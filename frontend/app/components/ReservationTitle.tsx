import { formatInTimeZone } from 'date-fns-tz';

interface Props {
  courtName: string;
  courtDescription: string;
  startTime: Date;
  endTime: Date;
  ownerName: string | null;
  ownerEmail: string;
}

const timeZone = 'America/Los_Angeles';

export default function ReservationTitle({
  courtName,
  courtDescription,
  startTime,
  endTime,
  ownerName,
  ownerEmail,
}: Props) {
  const formattedDate = formatInTimeZone(new Date(startTime), timeZone, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatInTimeZone(new Date(startTime), timeZone, 'h:mm a');
  const formattedEndTime = formatInTimeZone(new Date(endTime), timeZone, 'h:mm a');

  // Get the owner's display name, preferring full name over email
  const ownerDisplayName = ownerName || ownerEmail.split('@')[0];

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-gray-900">
          {courtName}
        </h1>
        <div className="text-lg text-gray-600 mt-1">
          Reserved by {ownerDisplayName}
        </div>
        <div className="text-lg font-medium text-blue-600 mt-1">
          {formattedDate} • {formattedStartTime} - {formattedEndTime} PT
        </div>
      </div>
      {courtDescription && (
        <p className="text-gray-600 mt-2">{courtDescription}</p>
      )}
    </div>
  );
} 