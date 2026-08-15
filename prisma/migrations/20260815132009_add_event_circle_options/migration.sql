-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "circleOptions" TEXT[] DEFAULT ARRAY['Family', 'Friends of the Family', 'Church Family']::TEXT[];
