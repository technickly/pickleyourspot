import { formatInTimeZone } from 'date-fns-tz';
import CopyButton from './CopyButton';
import { FaShare } from 'react-icons/fa';

interface Props {
  courtName: string;
  courtDescription: string;
  startTime: Date;
  endTime: Date;
  ownerName: string | null;
  ownerEmail: string;
  shortUrl: string;
}

const timeZone = 'America/Los_Angeles';

export default function ReservationTitle({
  courtName,
  courtDescription,
  startTime,
  endTime,
  ownerName,
  ownerEmail,
  shortUrl,
}: Props) {
  const formattedDate = formatInTimeZone(new Date(startTime), timeZone, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatInTimeZone(new Date(startTime), timeZone, 'h:mm a');
  const formattedEndTime = formatInTimeZone(new Date(endTime), timeZone, 'h:mm a');

  // Get the owner's display name, preferring full name over email
  const ownerDisplayName = ownerName || ownerEmail.split('@')[0];

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-gray-900">
            {courtName}
          </h1>
          <CopyButton
            text={`${window.location.origin}/r/${shortUrl}`}
            label={
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300">
                <FaShare className="text-lg" />
                Share
              </div>
            }
          />
        </div>
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