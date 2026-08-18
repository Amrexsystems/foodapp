import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Checkout from "./page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

const clearMock = vi.fn();
let mockLines: {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    image: string;
    quantity: number;
}[] = [];

vi.mock("@/lib/cart-context", () => ({
    useCart: () => ({
        lines: mockLines,
        subtotal: mockLines.reduce((sum, l) => sum + l.price * l.quantity, 0),
        clear: clearMock,
    }),
}));

function fillValidForm() {
    const user = userEvent.setup();
    return (async () => {
        await user.type(screen.getByLabelText("Full name"), "Jane Wanjiru");
        await user.type(
            screen.getByLabelText("Delivery address"),
            "12 Riverside Drive, Nairobi"
        );
        await user.type(screen.getByLabelText("Phone number"), "0712345678");
        return user;
    })();
}

beforeEach(() => {
    pushMock.mockClear();
    clearMock.mockClear();
    mockLines = [
        {
            id: "margherita",
            name: "Wood-Fired Margherita",
            category: "Pizza",
            description: "San Marzano tomato, fior di latte.",
            price: 16,
            image: "https://example.com/margherita.jpg",
            quantity: 1,
        },
        {
            id: "smash-burger",
            name: "Smash Burger, Aged Cheddar",
            category: "Burgers",
            description: "Double patty, caramelized onion.",
            price: 14,
            image: "https://example.com/burger.jpg",
            quantity: 1,
        },
    ];
    global.fetch = vi.fn();
});

describe("Checkout page", () => {
    it("shows an empty-cart message and no form when the cart is empty", () => {
        mockLines = [];
        render(<Checkout />);

        expect(screen.getByText(/your order is empty/i)).toBeInTheDocument();
        expect(screen.queryByLabelText("Full name")).not.toBeInTheDocument();
    });

    it("renders the delivery form and order summary when the cart has items", () => {
        render(<Checkout />);

        expect(screen.getByLabelText("Full name")).toBeInTheDocument();
        expect(screen.getByLabelText("Delivery address")).toBeInTheDocument();
        expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
        expect(screen.getByText("Wood-Fired Margherita", { exact: false })).toBeInTheDocument();
        expect(screen.getByText("$30.00")).toBeInTheDocument();
    });

    it("shows validation errors and does not submit when all fields are empty", async () => {
        const user = userEvent.setup();
        render(<Checkout />);

        await user.click(screen.getByRole("button", { name: /place order/i }));

        expect(
            await screen.findByText(/enter the name for this order/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/enter a delivery address/i)).toBeInTheDocument();
        expect(screen.getByText(/enter a phone number/i)).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("shows a validation error when the phone number is too short", async () => {
        const user = userEvent.setup();
        render(<Checkout />);

        await user.type(screen.getByLabelText("Full name"), "Jane Wanjiru");
        await user.type(
            screen.getByLabelText("Delivery address"),
            "12 Riverside Drive"
        );
        await user.type(screen.getByLabelText("Phone number"), "123");
        await user.click(screen.getByRole("button", { name: /place order/i }));

        expect(
            await screen.findByText(/enter a valid phone number/i)
        ).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("clears a field's error as soon as the user edits it", async () => {
        const user = userEvent.setup();
        render(<Checkout />);

        await user.click(screen.getByRole("button", { name: /place order/i }));
        expect(
            await screen.findByText(/enter the name for this order/i)
        ).toBeInTheDocument();

        await user.type(screen.getByLabelText("Full name"), "J");

        expect(
            screen.queryByText(/enter the name for this order/i)
        ).not.toBeInTheDocument();
    });

    it("submits the order, clears the cart, and redirects to the order status page", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: "1234" }),
        });

        render(<Checkout />);
        const user = await fillValidForm();
        await user.click(screen.getByRole("button", { name: /place order/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/orders",
                expect.objectContaining({ method: "POST" })
            );
        });

        const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        const body = JSON.parse(options.body as string);
        expect(body.customer).toEqual({
            name: "Jane Wanjiru",
            address: "12 Riverside Drive, Nairobi",
            phone: "0712345678",
        });
        expect(body.items).toHaveLength(2);

        await waitFor(() => expect(clearMock).toHaveBeenCalled());
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/order/1234"));
    });

    it("shows an error message and does not redirect when the API responds with an error", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Something went wrong" }),
        });

        render(<Checkout />);
        const user = await fillValidForm();
        await user.click(screen.getByRole("button", { name: /place order/i }));

        expect(
            await screen.findByText(/we couldn't place your order/i)
        ).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
        expect(clearMock).not.toHaveBeenCalled();
    });

    it("shows an error message when the network request throws", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
            new Error("Network down")
        );

        render(<Checkout />);
        const user = await fillValidForm();
        await user.click(screen.getByRole("button", { name: /place order/i }));

        expect(
            await screen.findByText(/we couldn't place your order/i)
        ).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });
});