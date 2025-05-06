import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const reviewSchema = z.object({
  overallRating: z.number().min(1, "Overall rating is required").max(5),
  codeQualityRating: z.number().min(1).max(5).optional().nullable(),
  documentationRating: z.number().min(1).max(5).optional().nullable(),
  supportRating: z.number().min(1).max(5).optional().nullable(),
  valueRating: z.number().min(1).max(5).optional().nullable(),
  comment: z.string().min(10, "Please provide a comment of at least 10 characters").max(1000)
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface AddReviewFormProps {
  transactionId: number;
  listingId: number;
  listingName: string;
  onSuccess?: () => void;
}

export function AddReviewForm({ transactionId, listingId, listingName, onSuccess }: AddReviewFormProps) {
  const { toast } = useToast();
  const [ratings, setRatings] = useState({
    overall: 0,
    codeQuality: 0,
    documentation: 0,
    support: 0,
    value: 0
  });

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      overallRating: 0,
      codeQualityRating: null,
      documentationRating: null,
      supportRating: null,
      valueRating: null,
      comment: ""
    }
  });

  const submitReview = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      const response = await apiRequest(
        "POST", 
        `/api/marketplace/transactions/${transactionId}/review`,
        data
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for sharing your feedback!",
      });
      // Invalidate the reviews query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings', listingId, 'reviews'] });
      // Invalidate the seller reviews query
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/sellers'] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ReviewFormValues) => {
    submitReview.mutate(data);
  };

  // Star rating component for reuse
  const StarRating = ({ 
    name, 
    value, 
    onChange 
  }: { 
    name: string; 
    value: number; 
    onChange: (value: number) => void 
  }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`cursor-pointer h-6 w-6 ${
              star <= value ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
            }`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setRatings(prev => ({ ...prev, [name]: star }))}
            onMouseLeave={() => setRatings(prev => ({ ...prev, [name]: form.getValues()[`${name}Rating`] || 0 }))}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
        <CardDescription>
          Share your experience with {listingName}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="overallRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <StarRating
                      name="overall"
                      value={ratings.overall}
                      onChange={(value) => {
                        setRatings(prev => ({ ...prev, overall: value }));
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    How would you rate your overall experience?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codeQualityRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code Quality</FormLabel>
                    <FormControl>
                      <StarRating
                        name="codeQuality"
                        value={ratings.codeQuality}
                        onChange={(value) => {
                          setRatings(prev => ({ ...prev, codeQuality: value }));
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Rate the quality of the code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentationRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documentation</FormLabel>
                    <FormControl>
                      <StarRating
                        name="documentation"
                        value={ratings.documentation}
                        onChange={(value) => {
                          setRatings(prev => ({ ...prev, documentation: value }));
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Rate the quality of documentation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support</FormLabel>
                    <FormControl>
                      <StarRating
                        name="support"
                        value={ratings.support}
                        onChange={(value) => {
                          setRatings(prev => ({ ...prev, support: value }));
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Rate the quality of seller support
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value for Money</FormLabel>
                    <FormControl>
                      <StarRating
                        name="value"
                        value={ratings.value}
                        onChange={(value) => {
                          setRatings(prev => ({ ...prev, value: value }));
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Rate the value for the price
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts about this app..."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide details about your experience (minimum 10 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={submitReview.isPending}
            >
              {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}