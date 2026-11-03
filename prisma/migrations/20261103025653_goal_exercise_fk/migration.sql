-- AddForeignKey
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
