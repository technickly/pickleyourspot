export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);
    const { userId, type, value } = validatedData;

    // Fetch the reservation and check permissions
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        owner: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    // ... rest of the function ...
  } catch (error) {
    // ... handle error ...
  }
} 