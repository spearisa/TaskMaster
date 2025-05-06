import { useQuery } from "@tanstack/react-query";
import { ListingReviews } from "./listing-reviews";
import { SellerReputation } from "./seller-reputation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ListingReviewsTabProps {
  listingId: number;
  sellerId: number;
}

export function ListingReviewsTab({ listingId, sellerId }: ListingReviewsTabProps) {
  return (
    <Tabs defaultValue="listing" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="listing">App Reviews</TabsTrigger>
        <TabsTrigger value="seller">Seller Reputation</TabsTrigger>
      </TabsList>
      
      <TabsContent value="listing" className="mt-0">
        <ListingReviews listingId={listingId} />
      </TabsContent>
      
      <TabsContent value="seller" className="mt-0">
        <SellerReputation sellerId={sellerId} />
      </TabsContent>
    </Tabs>
  );
}