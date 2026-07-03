"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Ruler } from "lucide-react"

export function SizeGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger 
        render={
          <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground" />
        }
      >
        <Ruler className="size-4" />
        Size Guide
      </DialogTrigger>
      <DialogContent className="max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Ring Size Guide</DialogTitle>
          <DialogDescription>
            Find your perfect fit using our international conversion chart.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 font-medium border-b">US / Canada</th>
                <th className="px-4 py-2 font-medium border-b">UK / Australia</th>
                <th className="px-4 py-2 font-medium border-b">EU</th>
                <th className="px-4 py-2 font-medium border-b">Inside Diameter (mm)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2">4</td>
                <td className="px-4 py-2">H 1/2</td>
                <td className="px-4 py-2">47</td>
                <td className="px-4 py-2">14.9</td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2">5</td>
                <td className="px-4 py-2">J 1/2</td>
                <td className="px-4 py-2">49</td>
                <td className="px-4 py-2">15.7</td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2">6</td>
                <td className="px-4 py-2">M</td>
                <td className="px-4 py-2">52</td>
                <td className="px-4 py-2">16.5</td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2">7</td>
                <td className="px-4 py-2">O</td>
                <td className="px-4 py-2">54</td>
                <td className="px-4 py-2">17.3</td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2">8</td>
                <td className="px-4 py-2">Q</td>
                <td className="px-4 py-2">57</td>
                <td className="px-4 py-2">18.1</td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2">9</td>
                <td className="px-4 py-2">S</td>
                <td className="px-4 py-2">60</td>
                <td className="px-4 py-2">18.9</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
