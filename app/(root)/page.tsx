import ProductList from "@/components/shared/product/product-list";
import { getLatestProducts } from "@/lib/actions/product.actions";
import { LATEST_PRODUCTS_LIMIT } from "@/lib/constants";

const Homepage = async () => {
  const latestProducts = await getLatestProducts();
  return (
    <ProductList
      data={latestProducts}
      title="Newest arrivals"
      limit={LATEST_PRODUCTS_LIMIT}
    />
  );
};

export default Homepage;
