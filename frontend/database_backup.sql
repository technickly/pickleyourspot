--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Court; Type: TABLE; Schema: public; Owner: nickanderson
--

CREATE TABLE public."Court" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "imageUrl" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Court" OWNER TO nickanderson;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: nickanderson
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL,
    "reservationId" text NOT NULL
);


ALTER TABLE public."Message" OWNER TO nickanderson;

--
-- Name: Reservation; Type: TABLE; Schema: public; Owner: nickanderson
--

CREATE TABLE public."Reservation" (
    id text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "courtId" text NOT NULL,
    "ownerId" text NOT NULL,
    description text,
    "shortUrl" text NOT NULL
);


ALTER TABLE public."Reservation" OWNER TO nickanderson;

--
-- Name: User; Type: TABLE; Schema: public; Owner: nickanderson
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO nickanderson;

--
-- Name: _ReservationParticipants; Type: TABLE; Schema: public; Owner: nickanderson
--

CREATE TABLE public."_ReservationParticipants" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_ReservationParticipants" OWNER TO nickanderson;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: nickanderson
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO nickanderson;

--
-- Data for Name: Court; Type: TABLE DATA; Schema: public; Owner: nickanderson
--

COPY public."Court" (id, name, description, "imageUrl", "createdAt", "updatedAt") FROM stdin;
3a01bb99-54d5-417d-9a17-860458f6963f	Carl Larsen	Open play court, no official reservations but can use this to schedule a time amongst friends to queue up! Amenities include bathroom, water fountains, shaded seating areas, and equipment rental.	https://images.unsplash.com/photo-1687204209659-3bded6aecd79?w=800&h=600&fit=crop&q=80	2025-06-03 12:45:02.987	2025-06-03 12:45:02.987
4538bacc-bf87-4ce1-bd8a-d6ec6ab104c4	Stern Grove	Free reservable courts available through San Francisco Recreation & Parks. Make official reservations at rec.us (https://www.rec.us/organizations/san-francisco-rec-park). Features include well-maintained courts, ample parking, picnic areas, and beautiful surroundings in the historic Stern Grove park.	https://images.unsplash.com/photo-1629901925121-8a141c2a42f4?w=800&h=600&fit=crop&q=80	2025-06-03 12:45:02.988	2025-06-03 12:45:02.988
a4539fab-3722-4177-a304-d617dca4c601	Goldman Park	Reserve courts here at $25 an hour, great for competitive play, social games, and private lessons. Features include covered seating, pro shop access, and night lighting. Use the chat feature to coordinate with your group and split payment all in one place! Ample street parking available on weekdays, dedicated lot on weekends.	https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&h=600&fit=crop&q=80	2025-06-03 12:45:02.989	2025-06-03 12:45:02.989
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: nickanderson
--

COPY public."Message" (id, content, "createdAt", "userId", "reservationId") FROM stdin;
5fc2c75a-5703-422f-bf65-8dd0f6afd9ec	fas	2025-06-03 12:48:41.573	a806995c-70b6-4b37-a3b0-b31cbb49fbfa	65968179-f300-4532-b067-818041a11a01
\.


--
-- Data for Name: Reservation; Type: TABLE DATA; Schema: public; Owner: nickanderson
--

COPY public."Reservation" (id, "startTime", "endTime", "createdAt", "updatedAt", "courtId", "ownerId", description, "shortUrl") FROM stdin;
65968179-f300-4532-b067-818041a11a01	2025-06-03 16:00:00	2025-06-03 16:30:00	2025-06-03 12:48:18.706	2025-06-03 12:48:18.706	a4539fab-3722-4177-a304-d617dca4c601	a806995c-70b6-4b37-a3b0-b31cbb49fbfa	\N	c2c92bcb-a285-433c-9f8b-26558a46ee45
7f8ae95a-ae72-4d6e-b2f7-a875dee32db7	2025-06-03 18:00:00	2025-06-03 18:30:00	2025-06-03 12:51:21.501	2025-06-03 12:51:21.501	4538bacc-bf87-4ce1-bd8a-d6ec6ab104c4	a806995c-70b6-4b37-a3b0-b31cbb49fbfa	fasdfas	cab935fb-bfe3-419f-91f4-8a4cd83451d9
102fbae4-d1c2-4825-9899-a4362953c6aa	2025-06-03 14:30:00	2025-06-03 15:00:00	2025-06-03 12:55:01.285	2025-06-03 12:55:01.285	3a01bb99-54d5-417d-9a17-860458f6963f	f850ea37-ee50-4638-9e4c-cbcafcb97e25	abc	912ab609-7f8f-4c14-9340-756b9148a932
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: nickanderson
--

COPY public."User" (id, email, name, image, "createdAt", "updatedAt") FROM stdin;
a806995c-70b6-4b37-a3b0-b31cbb49fbfa	technickly@gmail.com	Nick Anderson	https://lh3.googleusercontent.com/a/ACg8ocKNBc_y0ULZIgchL1U5toS65xOOlKE7vNlGrLAFdGRY-9BZMQ=s96-c	2025-06-03 12:48:09.968	2025-06-03 12:48:09.968
f850ea37-ee50-4638-9e4c-cbcafcb97e25	nickanderson4life@gmail.com	Nick Anderson	https://lh3.googleusercontent.com/a/ACg8ocLIBriAubnRAL74iiwEu2LmluUL2u2nF09fk3NVzgfP0L5S5A=s96-c	2025-06-03 12:45:31.628	2025-06-03 12:54:50.213
\.


--
-- Data for Name: _ReservationParticipants; Type: TABLE DATA; Schema: public; Owner: nickanderson
--

COPY public."_ReservationParticipants" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: nickanderson
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f729bf04-b9df-496e-bddf-903fbe64454e	e84fe05c83f2fb3a08e6841568d1006fe2cbe1e401e6574745124a1e7baa2b85	2025-06-03 05:45:01.73706-07	20250531081526_	\N	\N	2025-06-03 05:45:01.724968-07	1
270b25ab-a2da-4543-881b-58db479969cf	a4a5f9a561def503437f704b18fe4c3c4b9b407a71cdb3536694217cce587191	2025-06-03 05:45:01.738124-07	20250603123008_add_reservation_description	\N	\N	2025-06-03 05:45:01.737513-07	1
891d21db-226e-49d5-b2f3-b1e9329fd9e0	d1deb502b9c737753ac57306df25c8d5de94c2ae88b76c0b1c7d8a20fe1d0845	2025-06-03 05:45:01.949976-07	20250603123716_add_reservation_short_url	\N	\N	2025-06-03 05:45:01.738303-07	1
\.


--
-- Name: Court Court_pkey; Type: CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."Court"
    ADD CONSTRAINT "Court_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Reservation Reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_pkey" PRIMARY KEY (id);


--
-- Name: Reservation Reservation_shortUrl_key; Type: CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_shortUrl_key" UNIQUE ("shortUrl");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: nickanderson
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _ReservationParticipants_AB_unique; Type: INDEX; Schema: public; Owner: nickanderson
--

CREATE UNIQUE INDEX "_ReservationParticipants_AB_unique" ON public."_ReservationParticipants" USING btree ("A", "B");


--
-- Name: _ReservationParticipants_B_index; Type: INDEX; Schema: public; Owner: nickanderson
--

CREATE INDEX "_ReservationParticipants_B_index" ON public."_ReservationParticipants" USING btree ("B");


--
-- Name: Message Message_reservationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES public."Reservation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reservation Reservation_courtId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES public."Court"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reservation Reservation_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _ReservationParticipants _ReservationParticipants_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."_ReservationParticipants"
    ADD CONSTRAINT "_ReservationParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES public."Reservation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ReservationParticipants _ReservationParticipants_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nickanderson
--

ALTER TABLE ONLY public."_ReservationParticipants"
    ADD CONSTRAINT "_ReservationParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

