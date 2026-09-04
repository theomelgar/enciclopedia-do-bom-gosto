-- DropForeignKey
ALTER TABLE "collection_recommendation" DROP CONSTRAINT "collection_recommendation_recommendation_id_fkey";

-- DropForeignKey
ALTER TABLE "experience" DROP CONSTRAINT "experience_recommendation_id_fkey";

-- DropForeignKey
ALTER TABLE "photo" DROP CONSTRAINT "photo_recommendation_id_fkey";

-- DropForeignKey
ALTER TABLE "price_entry" DROP CONSTRAINT "price_entry_recommendation_place_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_link" DROP CONSTRAINT "purchase_link_recommendation_id_fkey";

-- DropForeignKey
ALTER TABLE "recommendation_keyword" DROP CONSTRAINT "recommendation_keyword_recommendation_id_fkey";

-- DropForeignKey
ALTER TABLE "recommendation_place" DROP CONSTRAINT "recommendation_place_recommendation_id_fkey";

-- DropForeignKey
ALTER TABLE "recommendation_share_code" DROP CONSTRAINT "recommendation_share_code_recommendation_id_fkey";

-- AddForeignKey
ALTER TABLE "recommendation_share_code" ADD CONSTRAINT "recommendation_share_code_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recommendation_place" ADD CONSTRAINT "recommendation_place_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "price_entry" ADD CONSTRAINT "price_entry_recommendation_place_id_fkey" FOREIGN KEY ("recommendation_place_id") REFERENCES "recommendation_place"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_link" ADD CONSTRAINT "purchase_link_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_recommendation" ADD CONSTRAINT "collection_recommendation_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recommendation_keyword" ADD CONSTRAINT "recommendation_keyword_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "experience" ADD CONSTRAINT "experience_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

